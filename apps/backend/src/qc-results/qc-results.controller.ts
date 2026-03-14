import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/users/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('QC Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qc-results')
export class QcResultsController {
  constructor(private readonly qcResultsService: QcResultsService) { }

  @Post()
  @ApiOperation({ summary: 'Submit a new QC result', description: 'Records a new quality control measurement against a specific control lot. The system automatically calculates the Z-Score and assigns a PASS, WARNING, or FAIL status.' })
  @ApiResponse({ 
    status: 201, 
    description: 'The QC result has been successfully recorded and evaluated.',
    schema: {
      example: {
        id: 1,
        measuredValue: 14.5,
        testDate: "2026-03-14T08:00:00.000Z",
        status: "PASS",
        comments: null,
        lotId: 1,
        performedBy: 5
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Control lot is missing required statistical values needed for evaluation.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
  @ApiResponse({ status: 404, description: 'Control lot not found.' })
  create(@Body() createQcResultDto: CreateQcResultDto, @CurrentUser('userId') userId: number) {
    return this.qcResultsService.create(createQcResultDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all QC results for a specific lot', description: 'Returns a comprehensive object containing the control lot rules (mean, limits) alongside an array of all historical QC results for that lot. Used to render the Levey-Jennings chart.' })
  @ApiQuery({ name: 'lotId', required: true, description: 'The ID of the control lot to fetch results for', type: Number, example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the control lot parameters and an array of all associated results ordered by date.',
    schema: {
      example: {
        lot: {
          id: 1,
          lotNumber: "LOT-HGB-2026-A",
          mean: 14.0,
          standardDevi: 0.5,
          upperControlLimit: 15.5,
          lowerControlLimit: 12.5,
          upperWarningLimit: 15.0,
          lowerWarningLimit: 13.0,
          testName: "Hemoglobin (HGB)",
          machineName: "Sysmex XN-1000"
        },
        results: [
          {
            id: 2,
            measuredValue: 14.2,
            testDate: "2026-03-14T08:15:00.000Z",
            status: "PASS",
            comments: "Morning run",
            lotId: 1,
            performedBy: 5
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
  @ApiResponse({ status: 404, description: 'Control lot not found.' })
  findAll(@Query('lotId', ParseIntPipe) lotId: number) {
    return this.qcResultsService.findAll(lotId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single QC result', description: 'Returns the full details of a single QC result, dynamically calculating and including the accurate Z-Score based on the current lot statistics.' })
  @ApiParam({ name: 'id', description: 'The unique ID of the QC result', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the QC result and its dynamically calculated Z-Score.',
    schema: {
      example: {
        id: 1,
        measuredValue: 14.5,
        testDate: "2026-03-14T08:00:00.000Z",
        status: "PASS",
        comments: null,
        lotId: 1,
        performedBy: 5,
        controlLot: {
          id: 1,
          lotNumber: "LOT-HGB-2026-A",
          mean: 14.0,
          standardDevi: 0.5
        },
        zScore: 1.00
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
  @ApiResponse({ status: 404, description: 'QC Result not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.qcResultsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a QC result comment', description: 'Updates the comments field for an existing QC result. The measured value and status cannot be modified to ensure data integrity.' })
  @ApiParam({ name: 'id', description: 'The unique ID of the QC result to update', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'The comment was updated successfully. Returns the full updated result object including the Z-Score.',
    schema: {
      example: {
        id: 1,
        measuredValue: 14.5,
        testDate: "2026-03-14T08:00:00.000Z",
        status: "PASS",
        comments: "Recalibrated instrument before test",
        lotId: 1,
        performedBy: 5,
        controlLot: {
          id: 1,
          mean: 14.0,
          standardDevi: 0.5
        },
        zScore: 1.00
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
  @ApiResponse({ status: 404, description: 'QC Result not found.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateQcResultDto: UpdateQcResultDto) {
    return this.qcResultsService.update(id, updateQcResultDto);
  }
}
